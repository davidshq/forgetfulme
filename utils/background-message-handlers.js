/**
 * @fileoverview Message handlers for background service worker
 * @module background-message-handlers
 * @description Handles all runtime messages from extension contexts
 */

/**
 * Message types for Chrome extension runtime messaging
 * @type {Object}
 */
const MESSAGE_TYPES = {
  MARK_AS_READ: 'MARK_AS_READ',
  BOOKMARK_SAVED: 'BOOKMARK_SAVED',
  BOOKMARK_UPDATED: 'BOOKMARK_UPDATED',
  GET_AUTH_STATE: 'GET_AUTH_STATE',
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  GET_CONFIG_SUMMARY: 'GET_CONFIG_SUMMARY',
  CHECK_URL_STATUS: 'CHECK_URL_STATUS',
  URL_STATUS_RESULT: 'URL_STATUS_RESULT',
};

/**
 * Create message handlers for background service worker
 * @param {ForgetfulMeBackground} background - Background service instance
 * @returns {Object} Map of message types to handler methods
 */
function createMessageHandlers(background) {
  return {
    [MESSAGE_TYPES.MARK_AS_READ]: background.handleMarkAsReadMessage.bind(background),
    [MESSAGE_TYPES.BOOKMARK_SAVED]: background.handleBookmarkSavedMessage.bind(background),
    [MESSAGE_TYPES.BOOKMARK_UPDATED]: background.handleBookmarkUpdatedMessage.bind(background),
    [MESSAGE_TYPES.GET_AUTH_STATE]: background.handleGetAuthStateMessage.bind(background),
    [MESSAGE_TYPES.AUTH_STATE_CHANGED]: background.handleAuthStateChangedMessage.bind(background),
    [MESSAGE_TYPES.GET_CONFIG_SUMMARY]: background.handleGetConfigSummaryMessage.bind(background),
    [MESSAGE_TYPES.CHECK_URL_STATUS]: background.handleCheckUrlStatusMessage.bind(background),
    [MESSAGE_TYPES.URL_STATUS_RESULT]: background.handleUrlStatusResultMessage.bind(background),
  };
}

// Export for use in background.js
// eslint-disable-next-line no-undef
if (typeof module !== 'undefined' && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = { MESSAGE_TYPES, createMessageHandlers };
}
