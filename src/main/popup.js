/**
 * @fileoverview Popup script entry point for the ForgetfulMe extension
 */

import { container } from '../utils/ServiceContainer.js';
import { ready } from '../utils/dom.js';
import { registerAllServices } from '../utils/serviceRegistration.js';
import { PopupController } from '../controllers/PopupController.js';

// Register all standard services for UI context
registerAllServices(container);

container.register(
  'popupController',
  c =>
    new PopupController(
      c.get('authService'),
      c.get('bookmarkService'),
      c.get('configService'),
      c.get('errorService')
    )
);

// Initialize popup when DOM is ready
(async () => {
  try {
    // Initialize logging service first with popup-specific config
    const loggingService = container.get('loggingService');
    await loggingService.initialize({
      level: 1, // INFO level for popup
      enableConsole: true,
      enableStorage: true,
      maxStoredLogs: 200, // Smaller buffer for popup
      contextFilters: ['PopupController', 'Popup', 'UI']
    });

    await ready();
    const popupController = container.get('popupController');
    await popupController.initialize();

    loggingService.info('Popup', 'Popup initialized successfully');

    // Clean up on unload
    window.addEventListener('beforeunload', () => {
      loggingService.debug('Popup', 'Popup unloading, cleaning up');
      popupController.destroy();
    });
  } catch (error) {
    console.error('Failed to initialize popup:', error);

    // Try to log through logging service if available
    try {
      const loggingService = container.get('loggingService');
      loggingService.critical('Popup', 'Failed to initialize popup', error);
    } catch (logError) {
      console.error('Logging service also failed:', logError);
    }

    // Show basic error message
    const messageArea = document.getElementById('message-area');
    if (messageArea) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'message error';
      errorDiv.textContent = 'Failed to initialize extension. Please try refreshing.';
      messageArea.appendChild(errorDiv);
    }
  }
})();
