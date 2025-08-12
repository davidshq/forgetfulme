// Minimal popup bootstrap
import { getActiveTabUrl, domainOf } from '../utils/url.js';
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
const messageArea = document.getElementById('message-area');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const clearSearchBtn = document.getElementById('clear-search');

const PAGE_SIZE = 10;
let currentPage = Number(sessionStorage.getItem('fm.page') || '1');
let hasMore = false;
let currentQuery = sessionStorage.getItem('fm.query') || '';
if (currentQuery && searchInput) searchInput.value = currentQuery;

async function renderRecent(query = '') {
  currentQuery = query;
  sessionStorage.setItem('fm.query', currentQuery);
  sessionStorage.setItem('fm.page', String(currentPage));
  const res = await listRecent(query, currentPage, PAGE_SIZE);
  if (res?.authError) {
    showMessage('error', 'Session expired. Please sign in.');
    appSection.hidden = true;
    authSection.hidden = false;
    return;
  }
  const { items, hasMore: more } = res;
  hasMore = more;
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
    const dom = document.createElement('span');
    dom.className = 'chip domain';
    dom.textContent = it.domain || domainOf(it.url || '');
    const when = document.createElement('span');
    if (it.last_read_at) {
      try {
        when.textContent = ' • ' + new Date(it.last_read_at).toLocaleString();
      } catch {}
    }
    meta.appendChild(chip);
    meta.appendChild(document.createTextNode(' '));
    meta.appendChild(dom);
    meta.appendChild(when);
    li.appendChild(title);
    li.appendChild(meta);
    recentList.appendChild(li);
  }
  // pagination controls
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = !hasMore;
  pageInfo.textContent = `Page ${currentPage}`;
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
    const stObj = mock ? { status: mockState.status } : (url ? await getStatusForUrl(url) : { status: null });
    if (stObj?.authError) {
      showMessage('error', 'Session expired. Please sign in.');
      appSection.hidden = true;
      authSection.hidden = false;
      return;
    }
    statusEl.textContent = stObj.status || (url ? 'Unknown' : 'No tab');
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
    const res = await toggleReadForUrl(url);
    if (res?.authError) {
      showMessage('error', 'Session expired. Please sign in.');
      appSection.hidden = true;
      authSection.hidden = false;
      return;
    }
    if (!res?.ok) {
      showMessage('error', 'Failed to update status', { retry: async () => toggleBtn.click() });
      return;
    }
  }
  const stObj = mock ? { status: mockState.status } : await getStatusForUrl(url);
  if (stObj?.authError) {
    showMessage('error', 'Session expired. Please sign in.');
    appSection.hidden = true;
    authSection.hidden = false;
    return;
  }
  statusEl.textContent = stObj?.status || 'Unknown';
  await renderRecent(searchInput.value || '');
});

searchInput.addEventListener('input', () => {
  currentPage = 1;
  renderRecent(searchInput.value || '');
});

clearSearchBtn?.addEventListener('click', () => {
  if (searchInput) searchInput.value = '';
  currentPage = 1;
  renderRecent('');
});

prevBtn?.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage -= 1;
    renderRecent(searchInput.value || '');
  }
});

nextBtn?.addEventListener('click', () => {
  if (hasMore) {
    currentPage += 1;
    renderRecent(searchInput.value || '');
  }
});

signoutBtn?.addEventListener('click', async () => {
  await signOut();
  authSection.hidden = false;
  appSection.hidden = true;
});

let lastCreds = null;

authForm?.addEventListener('submit', async e => {
  e.preventDefault();
  authStatus.textContent = 'Signing in...';
  const email = authEmail.value;
  const password = authPassword.value;
  lastCreds = { email, password };
  const { error } = await signInWithPassword(email, password);
  if (error) {
    authStatus.textContent = 'Sign-in failed';
    showMessage('error', 'Sign-in failed', {
      retry: async () => {
        if (!lastCreds) return;
        authStatus.textContent = 'Retrying...';
        const { error: e2 } = await signInWithPassword(lastCreds.email, lastCreds.password);
        if (e2) {
          authStatus.textContent = 'Sign-in failed';
          showMessage('error', 'Sign-in failed');
        } else {
          authStatus.textContent = 'Signed in';
          showMessage('success', 'Signed in');
          await init();
        }
      }
    });
    return;
  }
  authStatus.textContent = 'Signed in';
  showMessage('success', 'Signed in');
  await init();
});

init();

function showMessage(kind, text) {
  if (!messageArea) return;
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = text;
  if (arguments[2]?.retry) {
    const btn = document.createElement('button');
    btn.textContent = 'Retry';
    btn.addEventListener('click', () => {
      try { arguments[2].retry(); } finally { el.remove(); }
    });
    el.appendChild(btn);
  }
  messageArea.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 2500);
}

// Keyboard shortcuts: '/' focus search, 'Escape' clears when focused
window.addEventListener('keydown', e => {
  if (e.key === '/' && !/(input|textarea)/i.test(document.activeElement?.tagName || '')) {
    e.preventDefault();
    searchInput?.focus();
  } else if (e.key === 'Escape' && document.activeElement === searchInput) {
    clearSearchBtn?.click();
  }
});
