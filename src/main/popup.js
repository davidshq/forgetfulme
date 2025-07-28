/**
 * @fileoverview Popup script entry point for the ForgetfulMe extension
 */

import { container } from '../utils/ServiceContainer.js';
import { ready } from '../utils/dom.js';
import { ErrorService } from '../services/ErrorService.js';
import { ValidationService } from '../services/ValidationService.js';
import { StorageService } from '../services/StorageService.js';
import { ConfigService } from '../services/ConfigService.js';
import { AuthService } from '../services/AuthService.js';
import { BookmarkService } from '../services/BookmarkService.js';
import { PopupController } from '../controllers/PopupController.js';

// Register services in dependency injection container
container.register('errorService', () => new ErrorService());

container.register('validationService', () => new ValidationService());

container.register('storageService', c => new StorageService(c.get('errorService')));

container.register(
  'configService',
  c => new ConfigService(c.get('storageService'), c.get('validationService'), c.get('errorService'))
);

container.register(
  'authService',
  c => new AuthService(c.get('configService'), c.get('storageService'), c.get('errorService'))
);

container.register(
  'bookmarkService',
  c =>
    new BookmarkService(
      c.get('authService'),
      c.get('storageService'),
      c.get('configService'),
      c.get('validationService'),
      c.get('errorService')
    )
);

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
