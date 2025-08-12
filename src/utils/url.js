export async function getActiveTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.url || '';
}

export function normalizeUrl(raw) {
  try {
    const u = new URL(raw);
    u.hash = '';
    if (u.pathname.endsWith('/')) u.pathname = u.pathname.replace(/\/+$/, '/');
    u.hostname = u.hostname.toLowerCase();
    return u.toString();
  } catch {
    return raw;
  }
}

export function domainOf(raw) {
  try { return new URL(raw).hostname.toLowerCase(); } catch { return ''; }
}

