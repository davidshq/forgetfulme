/**
 * @fileoverview Options script entry point for the ForgetfulMe extension
 */

import { container } from '../utils/ServiceContainer.js';
import { ready } from '../utils/dom.js';
import { ErrorService } from '../services/ErrorService.js';
import { ValidationService } from '../services/ValidationService.js';
import { StorageService } from '../services/StorageService.js';
import { ConfigService } from '../services/ConfigService.js';
import { AuthService } from '../services/AuthService.js';
import { BookmarkService } from '../services/BookmarkService.js';
import { OptionsController } from '../controllers/OptionsController.js';

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
ready().then(async () => {
  try {
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
});
