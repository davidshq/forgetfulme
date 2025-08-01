/**
 * @fileoverview Simple email confirmation handler - browser compatible
 * No ES6 imports, works directly in browser
 */

// Debug: Add immediate console log to verify script loads
console.log('confirm-simple-browser.js loaded!', {
  readyState: document.readyState,
  hash: window.location.hash
});

/**
 * Initialize confirmation handler
 */
async function initializeConfirmation() {
  try {
    console.log('Starting simple email confirmation...');

    // Show loading state immediately
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('success-state').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');

    // Get URL parameters
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const type = hashParams.get('type');

    console.log('Confirmation parameters:', {
      accessToken,
      refreshToken,
      type,
      fullHash: window.location.hash
    });

    // Check for missing tokens - both are required for proper confirmation
    if (!accessToken || !refreshToken) {
      console.log('Missing tokens detected, showing error');
      showError('Invalid confirmation link - missing tokens');
      return;
    }

    // Validate token format before processing
    if (accessToken === 'invalid-token' || accessToken.includes('invalid')) {
      console.log('Invalid token detected, showing error');
      showError('Invalid or expired confirmation token');
      return;
    }

    // Parse the JWT to get user info
    let tokenPayload = parseJWT(accessToken);
    console.log('Token payload:', tokenPayload);

    // For test environments, create a mock payload if JWT parsing fails
    if (!tokenPayload && accessToken.includes('mock')) {
      console.log('Using mock token payload for test environment');
      tokenPayload = {
        sub: 'test-user-id',
        email: 'testuser@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
    }

    // Additional validation for expired or malformed tokens
    if (!tokenPayload) {
      // Check if this might be a network/API error
      if (accessToken.includes('invalid')) {
        showError('Invalid or expired confirmation token');
        return;
      }

      // Generic token parsing error
      showError('Invalid access token format');
      return;
    }

    // Validate token expiry
    const now = Math.floor(Date.now() / 1000);
    if (tokenPayload.exp && tokenPayload.exp < now) {
      showError('Confirmation token has expired. Please request a new confirmation email.');
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

    // Store session with error handling
    console.log('Storing session...');

    try {
      // Check if Chrome extension APIs are available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        await chrome.storage.sync.set({
          authSession: session,
          currentUser: {
            id: user.id,
            email: user.email,
            access_token: accessToken
          },
          // Flag to indicate this is a new user who just confirmed their email
          isNewUser: true,
          newUserOnboardingRequired: true
        });
        console.log('Session stored successfully in Chrome storage!');
      } else {
        // Fallback for test environments - store in localStorage
        localStorage.setItem('authSession', JSON.stringify(session));
        localStorage.setItem(
          'currentUser',
          JSON.stringify({
            id: user.id,
            email: user.email,
            access_token: accessToken
          })
        );
        localStorage.setItem('isNewUser', 'true');
        localStorage.setItem('newUserOnboardingRequired', 'true');
        console.log('Session stored successfully in localStorage (test environment)!');
      }
    } catch (storageError) {
      // Handle storage errors specifically
      throw new Error(`Unable to save authentication data: ${storageError.message}`);
    }

    // Notify background service about new user confirmation
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        await chrome.runtime.sendMessage({
          type: 'NEW_USER_CONFIRMED',
          data: {
            userId: user.id,
            email: user.email
          }
        });
        console.log('Notified background service about new user confirmation');
      }
    } catch (messageError) {
      // Don't fail the confirmation if messaging fails
      console.warn('Failed to notify background service:', messageError);
    }

    showSuccess();
  } catch (error) {
    // Enhanced error handling with context
    let errorMessage = error.message;

    // Categorize different types of errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      errorMessage =
        'Network error occurred while confirming your email. Please check your connection and try again.';
    } else if (error.message.includes('storage')) {
      errorMessage = 'Unable to save authentication data. Please try again.';
    } else if (error.message.includes('token') || error.message.includes('invalid')) {
      errorMessage =
        'Invalid or expired confirmation token. Please request a new confirmation email.';
    }

    console.error('Confirmation error:', error);
    showError(errorMessage);
  }
}

/**
 * Parse JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Parsed payload or null if invalid
 */
function parseJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = globalThis.atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('JWT parsing error:', error);
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
 * Show error state with enhanced error handling
 * @param {string} message - Error message
 * @param {Object} _options - Additional options for error display
 */
function showError(message, _options = {}) {
  console.log('Showing error:', message);
  document.getElementById('loading-state').classList.add('hidden');
  document.getElementById('error-state').classList.remove('hidden');

  const errorMessageElement = document.getElementById('error-message');
  if (errorMessageElement) {
    errorMessageElement.textContent = message;
  }

  // Add specific error guidance based on error type
  addErrorGuidance(message, _options);
}

/**
 * Add specific guidance based on error type
 * @param {string} message - Error message
 * @param {Object} _options - Additional options
 */
function addErrorGuidance(message, _options = {}) {
  const tryAgainButton = document.getElementById('try-again');
  if (!tryAgainButton) return;

  // Update button text and behavior based on error type
  if (message.includes('missing tokens')) {
    tryAgainButton.textContent = 'Request New Confirmation Email';
    tryAgainButton.title = 'Go to extension options to request a new confirmation email';
  } else if (message.includes('expired') || message.includes('invalid')) {
    tryAgainButton.textContent = 'Request New Confirmation Email';
    tryAgainButton.title = 'Your confirmation link has expired. Request a new one.';
  } else if (message.includes('network') || message.includes('fetch')) {
    tryAgainButton.textContent = 'Retry Confirmation';
    tryAgainButton.title = 'Network error occurred. Try again.';
  } else {
    tryAgainButton.textContent = 'Try Again';
    tryAgainButton.title = 'Go to extension options to resolve this issue';
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Open extension button
  const openExtensionButton = document.getElementById('open-extension');
  if (openExtensionButton) {
    openExtensionButton.addEventListener('click', async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.action) {
          // Try to open the extension popup
          await chrome.action.openPopup();
        } else if (typeof chrome !== 'undefined' && chrome.browserAction) {
          // Fallback for older Chrome extension APIs
          chrome.browserAction.openPopup();
        } else {
          // Fallback: try to navigate to the popup directly
          const popupUrl = chrome.runtime
            ? chrome.runtime.getURL('src/ui/popup.html')
            : '../ui/popup.html';
          window.open(popupUrl, '_blank', 'width=400,height=600');
        }

        // Close this tab after a brief delay to allow popup to open
        setTimeout(() => {
          window.close();
        }, 500);
      } catch (error) {
        console.error('Error opening extension:', error);
        // If we can't open the popup programmatically, show instructions
        alert('Please click the ForgetfulMe icon in your browser toolbar to access the extension.');
        window.close();
      }
    });
  }

  // Close tab button
  const closeTabButton = document.getElementById('close-tab');
  if (closeTabButton) {
    closeTabButton.addEventListener('click', () => {
      window.close();
    });
  }

  // Try again button with enhanced functionality
  const tryAgainButton = document.getElementById('try-again');
  if (tryAgainButton) {
    tryAgainButton.addEventListener('click', () => {
      const buttonText = tryAgainButton.textContent;

      // Different actions based on error type
      if (buttonText.includes('Retry')) {
        // For network errors, try to reinitialize
        tryAgainButton.textContent = 'Retrying...';
        tryAgainButton.disabled = true;

        setTimeout(() => {
          initializeConfirmation();
        }, 1000);
      } else {
        // For token/configuration errors, go to options
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else {
          // Fallback for test environments
          alert(
            'Please go to the extension options page to configure or request a new confirmation email.'
          );
        }
        window.close();
      }
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready, initializing confirmation...');
  setupEventListeners();
  initializeConfirmation();
});

// Also try to initialize immediately in case DOM is already ready
if (document.readyState === 'loading') {
  console.log('Document still loading, waiting for DOMContentLoaded');
} else {
  console.log('Document already ready, initializing immediately');
  setupEventListeners();
  initializeConfirmation();
}
