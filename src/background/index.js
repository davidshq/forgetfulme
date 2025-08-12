// MV3 service worker for ForgetfulMe v2
// - Handles keyboard command to toggle read state via Supabase RPC
// - Updates badge based on current tab's read status

import { toggleReadForUrl, getStatusForUrl, getUser } from '../utils/supabase.js';

async function getActiveTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.url || '';
}

async function updateBadgeForUrl(url) {
  const status = (await getUser()) ? await getStatusForUrl(url) : null;
  if (status === 'read') {
    await chrome.action.setBadgeText({ text: 'R' });
    await chrome.action.setBadgeBackgroundColor({ color: '#4caf50' });
  } else if (status === 'unread') {
    await chrome.action.setBadgeText({ text: 'U' });
    await chrome.action.setBadgeBackgroundColor({ color: '#f44336' });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}

chrome.commands.onCommand.addListener(async command => {
  if (command !== 'mark_as_read') return;
  const url = await getActiveTabUrl();
  if (!url) return;
  await toggleReadForUrl(url);
  await updateBadgeForUrl(url);
});

chrome.tabs.onActivated.addListener(async () => {
  const url = await getActiveTabUrl();
  if (url) await updateBadgeForUrl(url);
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url) {
    await updateBadgeForUrl(tab.url);
  }
});
