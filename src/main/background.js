/**
 * @fileoverview Background script entry point for the ForgetfulMe extension
 */

import { container } from '../utils/ServiceContainer.js';
import { ErrorService } from '../services/ErrorService.js';
import { ValidationService } from '../services/ValidationService.js';
import { StorageService } from '../services/StorageService.js';
import { ConfigService } from '../services/ConfigService.js';
import { AuthService } from '../services/AuthService.js';
import { BookmarkService } from '../services/BookmarkService.js';
import { BackgroundService } from '../background/BackgroundService.js';

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
  'backgroundService',
  c =>
    new BackgroundService(
      c.get('authService'),
      c.get('bookmarkService'),
      c.get('configService'),
      c.get('storageService'),
      c.get('errorService')
    )
);

// Initialize background service
(async () => {
  try {
    const backgroundService = container.get('backgroundService');
    await backgroundService.initialize();
  } catch (error) {
    console.error('Failed to initialize background service:', error);
  }
})();
