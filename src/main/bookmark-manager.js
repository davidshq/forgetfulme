/**
 * @fileoverview Bookmark manager script entry point for the ForgetfulMe extension
 */

import { container } from '../utils/ServiceContainer.js';
import { ready } from '../utils/dom.js';
import { ErrorService } from '../services/ErrorService.js';
import { ValidationService } from '../services/ValidationService.js';
import { StorageService } from '../services/StorageService.js';
import { ConfigService } from '../services/ConfigService.js';
import { AuthService } from '../services/AuthService.js';
import { BookmarkService } from '../services/BookmarkService.js';
import { BookmarkManagerController } from '../controllers/BookmarkManagerController.js';

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
ready().then(async () => {
  try {
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
});
