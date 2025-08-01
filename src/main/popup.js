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
ready().then(async () => {
  try {
    const popupController = container.get('popupController');
    await popupController.initialize();

    // Clean up on unload
    window.addEventListener('beforeunload', () => {
      popupController.destroy();
    });
  } catch (error) {
    console.error('Failed to initialize popup:', error);

    // Show basic error message
    const messageArea = document.getElementById('message-area');
    if (messageArea) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'message error';
      errorDiv.textContent = 'Failed to initialize extension. Please try refreshing.';
      messageArea.appendChild(errorDiv);
    }
  }
});
