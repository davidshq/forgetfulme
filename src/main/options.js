/**
 * @fileoverview Options script entry point for the ForgetfulMe extension
 */

import { container } from '../utils/ServiceContainer.js';
import { ready } from '../utils/dom.js';
import { registerAllServices } from '../utils/serviceRegistration.js';
import { OptionsController } from '../controllers/OptionsController.js';

// Register all standard services for UI context
registerAllServices(container);

container.register(
  'optionsController',
  c =>
    new OptionsController(
      c.get('configService'),
      c.get('authService'),
      c.get('bookmarkService'),
      c.get('storageService'),
      c.get('validationService'),
      c.get('errorService')
    )
);

// Initialize options when DOM is ready
(async () => {
  try {
    await ready();
    const optionsController = container.get('optionsController');
    await optionsController.initialize();

    // Clean up on unload
    window.addEventListener('beforeunload', () => {
      optionsController.destroy();
    });
  } catch (error) {
    console.error('Failed to initialize options:', error);

    // Show basic error message
    const messageArea = document.getElementById('message-area');
    if (messageArea) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'message error';
      errorDiv.textContent = 'Failed to initialize options page. Please try refreshing.';
      messageArea.appendChild(errorDiv);
    }
  }
})();
