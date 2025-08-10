/**
 * @fileoverview Background script entry point for the ForgetfulMe extension
 */

import { container } from '../utils/ServiceContainer.js';
import { registerCoreServices } from '../utils/serviceRegistration.js';
import { BackgroundService } from '../background/BackgroundService.js';

// Register core services for background context
registerCoreServices(container);

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
  let loggingService = null;

  try {
    // Initialize logging service first with background-specific config
    loggingService = container.get('loggingService');
    await loggingService.initialize({
      level: 1, // INFO level for background
      enableConsole: true,
      enableStorage: true,
      includeStackTrace: true, // Include stack traces in background for debugging
      contextFilters: ['BackgroundService', 'ServiceWorker'] // Focus on background contexts
    });

    const backgroundService = container.get('backgroundService');
    await backgroundService.initialize();

    loggingService.info('Background', 'Background service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize background service:', error);

    // Only try to log through logging service if it was successfully initialized
    if (loggingService && loggingService.initialized) {
      try {
        loggingService.critical('Background', 'Failed to initialize background service', error);
      } catch (logError) {
        // Fallback if logging service also fails
        console.error('Logging service also failed:', logError);
      }
    }
  }
})();
