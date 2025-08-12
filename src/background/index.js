// Minimal MV3 service worker for ForgetfulMe v2
// - Handles keyboard command to toggle read state
// - Updates badge based on current tab's read status

// Placeholder: these utils will be implemented in src/utils
async function getActiveTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.url || '';
}

async function updateBadgeForUrl(_url) {
  // Set a simple dot for now; later reflect read/unread
  await chrome.action.setBadgeText({ text: '' });
  await chrome.action.setBadgeBackgroundColor({ color: '#4caf50' });
}

chrome.commands.onCommand.addListener(async command => {
  if (command !== 'mark_as_read') return;
  const url = await getActiveTabUrl();
  if (!url) return;
  // TODO: call Supabase RPC toggle_read via utils/supabase
  await updateBadgeForUrl(url);
});

