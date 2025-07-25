// Initialization logic for bookmark management

/**
 * Initialize the page asynchronously after DOM is ready
 * @param {Object} params
 * @param {Object} params.UIComponents - UI components utility
 * @param {HTMLElement} params.appContainer - Main app container
 * @param {Function} params.initializeElements - Function to initialize DOM elements
 * @param {Function} params.initializeApp - Function to initialize the app
 * @param {Function} params.initializeAuthState - Function to initialize auth state
 * @param {Object} params.ErrorHandler - Error handler utility
 */
export async function initializeAsync({
  UIComponents,
  initializeElements,
  initializeApp,
  initializeAuthState,
  ErrorHandler,
}) {
  try {
    await UIComponents.DOM.ready();
    initializeElements();
    await initializeApp();
    initializeAuthState();
  } catch (error) {
    ErrorHandler.handle(error, 'bookmark-management.initializeAsync');
    // Failed to initialize bookmark management page
  }
}

/**
 * Initialize DOM elements
 * @param {Object} params
 * @param {Object} params.UIComponents - UI components utility
 * @param {HTMLElement} params.appContainer - Main app container (will be set)
 * @param {Object} params.ErrorHandler - Error handler utility
 * @returns {HTMLElement} The app container
 */
export function initializeElements({ UIComponents, ErrorHandler }) {
  const appContainer = UIComponents.DOM.getElement('app');
  if (!appContainer) {
    throw ErrorHandler.createError(
      'App container not found',
      ErrorHandler.ERROR_TYPES.UI,
      'bookmark-management.initializeElements'
    );
  }
  return appContainer;
}

/**
 * Initialize the application
 * @param {Object} params
 * @param {Object} params.supabaseConfig - Supabase config instance
 * @param {Object} params.supabaseService - Supabase service instance
 * @param {Object} params.authStateManager - Auth state manager instance
 * @param {HTMLElement} params.appContainer - Main app container
 * @param {Function} params.showSetupInterface - Function to show setup UI
 * @param {Function} params.showMainInterface - Function to show main UI
 * @param {Function} params.showAuthInterface - Function to show auth UI
 * @param {Object} params.ErrorHandler - Error handler utility
 * @param {Object} params.UIMessages - UI messages utility
 */
export async function initializeApp({
  supabaseConfig,
  supabaseService,
  authStateManager,
  appContainer,
  showSetupInterface,
  showMainInterface,
  showAuthInterface,
  ErrorHandler,
  UIMessages,
}) {
  try {
    if (!(await supabaseConfig.isConfigured())) {
      showSetupInterface();
      return;
    }
    let retryCount = 0;
    const maxRetries = 3;
    while (retryCount < maxRetries) {
      try {
        await supabaseService.initialize();
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    const isAuthenticated = await authStateManager.isAuthenticated();
    if (isAuthenticated) {
      showMainInterface();
    } else {
      showAuthInterface();
    }
  } catch (error) {
    const errorResult = ErrorHandler.handle(
      error,
      'bookmark-management.initializeApp'
    );
    if (errorResult.shouldShowToUser) {
      UIMessages.error(errorResult.userMessage, appContainer);
    }
    showSetupInterface();
  }
}
