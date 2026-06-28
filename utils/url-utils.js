/**
 * @fileoverview URL helpers for extension pages and background
 * @module utils/url-utils
 */

const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'moz-extension://',
];

/**
 * Returns true when the URL cannot be bookmarked (browser or extension pages).
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isRestrictedUrl(url) {
  if (!url) {
    return true;
  }

  return RESTRICTED_URL_PREFIXES.some(prefix => url.startsWith(prefix));
}
