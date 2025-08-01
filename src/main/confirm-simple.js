/**
 * @fileoverview Simple email confirmation handler for ForgetfulMe
 * Stores tokens directly without complex initialization
 */

import { ErrorService } from '../services/ErrorService.js';

/**
 * Initialize confirmation handler
 */
async function initializeConfirmation() {
  const errorService = new ErrorService();

  try {
    console.log('Starting simple email confirmation...');

    // Get URL parameters
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    console.log('Confirmation type:', type);

    if (!accessToken || !refreshToken) {
      const errorInfo = errorService.handle(
        new Error('Invalid confirmation link - missing tokens'),
        'ConfirmationSimple.tokenValidation'
      );
      showError(errorInfo.message);
      return;
    }

    // Parse the JWT to get user info
    const tokenPayload = parseJWT(accessToken);
    console.log('Token payload:', tokenPayload);

    if (!tokenPayload) {
      const errorInfo = errorService.handle(
        new Error('Invalid access token'),
        'ConfirmationSimple.tokenParsing'
      );
      showError(errorInfo.message);
      return;
    }

    // Create user object from token
    const user = {
      id: tokenPayload.sub,
      email: tokenPayload.email,
      email_confirmed_at: new Date().toISOString(),
      app_metadata: tokenPayload.app_metadata || {},
      user_metadata: tokenPayload.user_metadata || {}
    };

    // Create session object
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: user
    };

    // Store directly in chrome storage
    console.log('Storing session...');
    await chrome.storage.sync.set({
      authSession: session,
      currentUser: {
        id: user.id,
        email: user.email,
        access_token: accessToken
      }
    });

    console.log('Session stored successfully!');
    showSuccess();
  } catch (error) {
    const errorInfo = errorService.handle(error, 'ConfirmationSimple.initialize');
    showError(errorInfo.message);
  }
}

/**
 * Parse JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Parsed payload or null if invalid
 */
function parseJWT(token) {
  const errorService = new ErrorService();

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = globalThis.atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    errorService.handle(error, 'ConfirmationSimple.parseJWT');
    return null;
  }
}

/**
 * Show success state
 */
function showSuccess() {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('success-state').classList.remove('hidden');
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showError(message) {
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Close tab button
  const closeTabButton = document.getElementById('close-tab');
  if (closeTabButton) {
    closeTabButton.addEventListener('click', () => {
      window.close();
    });
  }

  // Try again button
  const tryAgainButton = document.getElementById('try-again');
  if (tryAgainButton) {
    tryAgainButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
      window.close();
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initializeConfirmation();
});
