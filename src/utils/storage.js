export async function get(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

export async function set(items) {
  return new Promise(resolve => chrome.storage.local.set(items, resolve));
}

export async function remove(keys) {
  return new Promise(resolve => chrome.storage.local.remove(keys, resolve));
}
