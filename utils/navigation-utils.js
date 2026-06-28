/**
 * @fileoverview Navigation helpers for extension pages
 * @module utils/navigation-utils
 */

/**
 * Open the bookmark management page in a new tab.
 */
export function openBookmarkManagementTab() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('bookmark-management.html'),
  });
}
