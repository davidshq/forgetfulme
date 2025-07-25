// Authentication state logic for bookmark management

/**
 * Initialize authentication state and set up listeners
 * @param {Object} params
 * @param {Object} params.authStateManager - Auth state manager instance
 * @param {Function} params.handleAuthStateChange - Handler for auth state changes
 * @param {Object} params.ErrorHandler - Error handler utility
 */
export async function initializeAuthState({
  authStateManager,
  handleAuthStateChange,
  ErrorHandler,
}) {
  try {
    await authStateManager.initialize();
    authStateManager.addListener(session => {
      handleAuthStateChange(session);
    });
  } catch (error) {
    ErrorHandler.handle(error, 'bookmark-management.initializeAuthState');
    // Failed to initialize auth state
  }
}

/**
 * Handle authentication state changes
 * @param {Object} params
 * @param {Object|null} params.session - The current session object or null if not authenticated
 * @param {Function} params.showMainInterface - Function to show main UI
 * @param {Function} params.showAuthInterface - Function to show auth UI
 */
export function handleAuthStateChange({
  session,
  showMainInterface,
  showAuthInterface,
}) {
  if (session) {
    showMainInterface();
  } else {
    showAuthInterface();
  }
}
