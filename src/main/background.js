/**
 * @fileoverview Background script entry point for the ForgetfulMe extension
 */

import { container } from '../utils/ServiceContainer.js';
import { ErrorService } from '../services/ErrorService.js';
import { ValidationService } from '../services/ValidationService.js';
import { StorageService } from '../services/StorageService.js';
import { ConfigService } from '../services/ConfigService.js';
import { BackgroundService } from '../background/BackgroundService.js';

// Register core services for background context
container.register('errorService', () => new ErrorService());

container.register('validationService', () => new ValidationService());

container.register('storageService', c => new StorageService(c.get('errorService')));

container.register(
  'configService',
  c => new ConfigService(c.get('storageService'), c.get('validationService'), c.get('errorService'))
);

// Background service with minimal dependencies (no Supabase services)
container.register(
  'backgroundService',
  c =>
    new BackgroundService(
      null, // authService - not needed in service worker
      null, // bookmarkService - not needed in service worker
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
