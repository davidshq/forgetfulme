/**
 * @fileoverview Shared page initialization for popup, options, and bookmark management
 * @module utils/page-controller
 */

import UIComponents from './ui-components.js';
import ErrorHandler from './error-handler.js';
import { MESSAGE_TYPES } from './constants.js';

/**
 * Initialize auth state manager and wire listeners shared across extension pages.
 * @param {Object} options
 * @param {import('./auth-state-manager.js').default} options.authStateManager
 * @param {Function} options.onAuthStateChange
 * @param {boolean} [options.listenForRuntimeAuth=true]
 */
export async function initializePageAuth({
  authStateManager,
  onAuthStateChange,
  listenForRuntimeAuth = true,
}) {
  await authStateManager.initialize();

  authStateManager.addListener('authStateChanged', onAuthStateChange);

  if (listenForRuntimeAuth) {
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === MESSAGE_TYPES.AUTH_STATE_CHANGED) {
        onAuthStateChange(message.session);
      }
    });
  }
}

/**
 * Run the common page bootstrap: DOM ready, optional config init, app init, auth wiring.
 * @param {Object} options
 * @param {Function} options.initializeElements
 * @param {Function} options.initializeApp
 * @param {import('./auth-state-manager.js').default} options.authStateManager
 * @param {Function} options.onAuthStateChange
 * @param {import('./config-manager.js').default} [options.configManager]
 * @param {boolean} [options.initConfigManager=false]
 * @param {boolean} [options.listenForRuntimeAuth=true]
 * @param {string} options.context - ErrorHandler context prefix
 */
export async function initializePage({
  initializeElements,
  initializeApp,
  authStateManager,
  onAuthStateChange,
  configManager,
  initConfigManager = false,
  listenForRuntimeAuth = true,
  context,
}) {
  try {
    await UIComponents.DOM.ready();

    if (initConfigManager && configManager) {
      await configManager.initialize();
    }

    initializeElements();
    await initializeApp();

    await initializePageAuth({
      authStateManager,
      onAuthStateChange,
      listenForRuntimeAuth,
    });
  } catch (error) {
    ErrorHandler.handle(error, context);
  }
}
