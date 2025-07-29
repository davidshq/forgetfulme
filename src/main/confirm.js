/**
 * @fileoverview Email confirmation handler for ForgetfulMe
 * Processes email confirmation tokens from Supabase
 */

import { ServiceContainer } from '../utils/ServiceContainer.js';
import { createSupabaseClient } from '../lib/supabase-bundle.js';

/**
 * Initialize confirmation handler
 */
async function initializeConfirmation() {
  try {
    console.log('Starting email confirmation...');
    // Show loading state
    showState('loading');

    // Get URL parameters
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const error = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');

    console.log('URL params:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      error,
      fullHash: window.location.hash
    });

    // Check for errors
    if (error) {
      showError(errorDescription || 'Email confirmation failed');
      return;
    }

    // Check for tokens
    if (!accessToken || !refreshToken) {
      showError('Invalid confirmation link');
      return;
    }

    console.log('Initializing services...');
    // Initialize services
    const container = new ServiceContainer();
    const services = await container.initialize();
    const { authService, storageService } = services;

    console.log('Services initialized');

    // Store the session
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: null // Will be populated by AuthService
    };

    // Get user details using the access token
    console.log('Getting config...');
    const config = await storageService.getConfig();
    if (!config) {
      showError('Extension not configured. Please configure Supabase in the extension options.');
      return;
    }
    console.log('Config loaded');

    // Initialize Supabase client to get user details
    const supabaseClient = createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey);

    // Get user with the access token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(accessToken);

    if (userError || !user) {
      showError('Failed to get user details');
      return;
    }

    // Update session with user
    session.user = user;

    // Handle the successful authentication
    await authService.handleAuthSuccess(session);

    // Show success
    showState('success');

  } catch (error) {
    console.error('Confirmation error:', error);
    showError(error.message || 'An unexpected error occurred');
  }
}

/**
 * Show specific state
 * @param {string} state - State to show (loading, success, error)
 */
function showState(state) {
  // Hide all states
  document.querySelectorAll('#loading-state, #success-state, #error-state').forEach(el => {
    el.classList.add('hidden');
  });

  // Show requested state
  const stateElement = document.getElementById(`${state}-state`);
  if (stateElement) {
    stateElement.classList.remove('hidden');
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  const errorMessageElement = document.getElementById('error-message');
  if (errorMessageElement) {
    errorMessageElement.textContent = message;
  }
  showState('error');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Open popup button
  const openPopupButton = document.getElementById('open-popup');
  if (openPopupButton) {
    openPopupButton.addEventListener('click', () => {
      // Can't open popup programmatically from a web page
      // Instead, show instructions
      alert('Email confirmed! Click the ForgetfulMe extension icon in your browser toolbar to sign in.');
      // Close this tab
      window.close();
    });
  }

  // Try again button
  const tryAgainButton = document.getElementById('try-again');
  if (tryAgainButton) {
    tryAgainButton.addEventListener('click', () => {
      // Go to extension options
      chrome.runtime.openOptionsPage();
      // Close this tab
      window.close();
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeConfirmation();
  });
} else {
  setupEventListeners();
  initializeConfirmation();
}
