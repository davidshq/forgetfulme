/**
 * @fileoverview Bookmark manager script entry point for the ForgetfulMe extension
 */

import { container } from '../utils/ServiceContainer.js';
import { ready } from '../utils/dom.js';
import { registerAllServices } from '../utils/serviceRegistration.js';
import { BookmarkManagerController } from '../controllers/BookmarkManagerController.js';

// Register all standard services for UI context
registerAllServices(container);

container.register(
  'bookmarkManagerController',
  c =>
    new BookmarkManagerController(
      c.get('authService'),
      c.get('bookmarkService'),
      c.get('configService'),
      c.get('validationService'),
      c.get('errorService')
    )
);

// Initialize bookmark manager when DOM is ready
(async () => {
  try {
    await ready();
    const bookmarkManagerController = container.get('bookmarkManagerController');
    await bookmarkManagerController.initialize();

    // Clean up on unload
    window.addEventListener('beforeunload', () => {
      bookmarkManagerController.destroy();
    });
  } catch (error) {
    console.error('Failed to initialize bookmark manager:', error);

    // Show basic error message
    const messageArea = document.getElementById('message-area');
    if (messageArea) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'message error';
      errorDiv.textContent = 'Failed to initialize bookmark manager. Please try refreshing.';
      messageArea.appendChild(errorDiv);
    }
  }
})();
