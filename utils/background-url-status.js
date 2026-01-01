/**
 * @fileoverview URL status checking for background service worker
 * @module background-url-status
 * @description Handles URL status checking and icon updates
 */

/**
 * URL status checker for background service worker
 */
class UrlStatusChecker {
  /**
   * Initialize URL status checker
   * @param {ForgetfulMeBackground} background - Background service instance
   */
  constructor(background) {
    this.background = background;
  }

  /**
   * Check if a URL is already saved and update icon accordingly
   * @async
   * @param {Object} tab - The tab object containing URL information
   * @description Checks if the URL is already saved and updates the extension icon
   */
  async checkUrlStatus(tab) {
    try {
      // Skip browser pages and extension pages
      if (
        !tab.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('about:') ||
        tab.url.startsWith('moz-extension://')
      ) {
        this.background.updateIconForUrl(null, false);
        return;
      }

      // Check if user is authenticated
      if (!this.background.authState) {
        this.background.updateIconForUrl(null, false);
        return;
      }

      // Check cache first
      const cacheKey = tab.url;
      const cached = this.background.urlStatusCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.background.cacheTimeout) {
        this.background.updateIconForUrl(tab.url, cached.isSaved);
        return;
      }

      // For now, show default state since we can't access database from background
      // The popup will handle the actual URL checking when opened
      this.background.updateIconForUrl(tab.url, false);
    } catch (_error) {
      // Error checking URL status - show default icon
      this.background.updateIconForUrl(null, false);
    }
  }
}

// Export for use in background.js
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = UrlStatusChecker;
}
