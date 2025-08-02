/**
 * @fileoverview Shared service registration utilities for the ForgetfulMe extension
 */

import { ErrorService } from '../services/ErrorService.js';
import { ValidationService } from '../services/ValidationService.js';
import { StorageService } from '../services/StorageService.js';
import { ConfigService } from '../services/ConfigService.js';
import { LoggingService } from '../services/LoggingService.js';
import { AuthService } from '../services/AuthService.js';
import { BookmarkService } from '../services/BookmarkService.js';

/**
 * Register core services that are common across all contexts
 * @param {ServiceContainer} container - The service container
 */
export function registerCoreServices(container) {
  // Core error handling and validation
  container.register('errorService', () => new ErrorService());
  container.register('validationService', () => new ValidationService());

  // Storage service depends on error service
  container.register('storageService', c => new StorageService(c.get('errorService')));

  // Logging service depends on storage and error services
  container.register(
    'loggingService',
    c => new LoggingService(c.get('storageService'), c.get('errorService'))
  );

  // Configuration service depends on storage, validation, and error services
  container.register(
    'configService',
    c =>
      new ConfigService(c.get('storageService'), c.get('validationService'), c.get('errorService'))
  );
}

/**
 * Register UI services that depend on core services (auth, bookmarks)
 * @param {ServiceContainer} container - The service container
 */
export function registerUIServices(container) {
  // Authentication service depends on config, storage, error, and logging services
  container.register(
    'authService',
    c =>
      new AuthService(
        c.get('configService'),
        c.get('storageService'),
        c.get('errorService'),
        c.get('loggingService')
      )
  );

  // Bookmark service depends on auth, storage, config, validation, error, and logging services
  container.register(
    'bookmarkService',
    c =>
      new BookmarkService(
        c.get('authService'),
        c.get('storageService'),
        c.get('configService'),
        c.get('validationService'),
        c.get('errorService'),
        c.get('loggingService')
      )
  );
}

/**
 * Register all standard services for UI contexts (popup, options, bookmark-manager)
 * @param {ServiceContainer} container - The service container
 */
export function registerAllServices(container) {
  registerCoreServices(container);
  registerUIServices(container);
}
