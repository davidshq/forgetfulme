/**
 * @fileoverview Unit tests for service registration utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { ServiceContainer } from '../../../src/utils/ServiceContainer.js';
import { ErrorService } from '../../../src/services/ErrorService.js';
import { ValidationService } from '../../../src/services/ValidationService.js';
import { StorageService } from '../../../src/services/StorageService.js';
import { ConfigService } from '../../../src/services/ConfigService.js';
import { LoggingService } from '../../../src/services/LoggingService.js';

// Mock supabase lib to avoid referencing window.supabase
vi.mock('../../../src/lib/supabase.js', () => ({
  createClient: vi.fn(() => ({}))
}));

describe('utils/serviceRegistration', () => {
  it('registerCoreServices should register core services and instantiate them', async () => {
    const { registerCoreServices } = await import('../../../src/utils/serviceRegistration.js');

    const c = new ServiceContainer();
    registerCoreServices(c);

    expect(c.has('errorService')).toBe(true);
    expect(c.has('validationService')).toBe(true);
    expect(c.has('storageService')).toBe(true);
    expect(c.has('loggingService')).toBe(true);
    expect(c.has('configService')).toBe(true);

    expect(c.get('errorService')).toBeInstanceOf(ErrorService);
    expect(c.get('validationService')).toBeInstanceOf(ValidationService);
    expect(c.get('storageService')).toBeInstanceOf(StorageService);
    expect(c.get('loggingService')).toBeInstanceOf(LoggingService);
    expect(c.get('configService')).toBeInstanceOf(ConfigService);
  });

  it('registerAllServices should also register UI services', async () => {
    const { registerAllServices } = await import('../../../src/utils/serviceRegistration.js');

    const c = new ServiceContainer();
    registerAllServices(c);
    expect(c.has('authService')).toBe(true);
    expect(c.has('bookmarkService')).toBe(true);
  });
});


