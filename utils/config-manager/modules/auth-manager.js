/**
 * @fileoverview Auth manager for authentication session management
 * @module auth-manager
 * @description Handles authentication session operations
 */

import ErrorHandler from '../../error-handler.js';

/**
 * Auth Manager for Authentication Session Management
 * @class AuthManager
 * @description Manages authentication session operations
 */
class AuthManager {
  /**
   * Initialize the auth manager
   * @constructor
   * @param {Object} configManager - Reference to the main config manager
   */
  constructor(configManager) {
    this.configManager = configManager;
  }

  /**
   * Set authentication session
   * @param {Object|null} session - Authentication session object
   * @description Saves authentication session to storage
   */
  async setAuthSession(session) {
    this.configManager.config.auth = session;

    // Save to storage
    await chrome.storage.sync.set({
      auth_session: session,
    });

    this.configManager.events.notifyListeners('authSessionChanged', session);

    // Notify all contexts via runtime message
    try {
      chrome.runtime
        .sendMessage({
          type: 'AUTH_STATE_CHANGED',
          session: session,
        })
        .catch(error => {
          ErrorHandler.handle(error, 'auth-manager.setAuthSession.runtime');
        });
    } catch (error) {
      ErrorHandler.handle(error, 'auth-manager.setAuthSession');
    }
  }

  /**
   * Clear authentication session
   * @description Removes authentication session from storage
   */
  async clearAuthSession() {
    this.configManager.config.auth = null;

    // Remove from storage
    await chrome.storage.sync.remove(['auth_session']);

    this.configManager.events.notifyListeners('authSessionChanged', null);

    // Notify all contexts via runtime message
    try {
      chrome.runtime
        .sendMessage({
          type: 'AUTH_STATE_CHANGED',
          session: null,
        })
        .catch(error => {
          ErrorHandler.handle(error, 'auth-manager.clearAuthSession.runtime');
        });
    } catch (error) {
      ErrorHandler.handle(error, 'auth-manager.clearAuthSession');
    }
  }
}

export default AuthManager;
