/**
 * @fileoverview Unit tests for AuthModalComponent
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { AuthModalComponent } from '../../../../src/ui/components/AuthModalComponent.js';

// Mock services
const createMockAuthService = () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn()
});

const createMockConfigService = () => ({
  isSupabaseConfigured: vi.fn().mockResolvedValue(true)
});

const createMockErrorService = () => ({
  handle: vi.fn()
});

const createMockValidationService = () => ({
  validateEmail: vi.fn().mockReturnValue({ isValid: true, data: 'test@example.com', errors: [] }),
  validatePassword: vi.fn().mockReturnValue({ isValid: true, data: 'password123', errors: [] })
});

const setupDOM = () => {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <dialog id="auth-modal">
          <div id="auth-tabs" class="tab-navigation">
            <button id="signin-tab" class="tab-button">Sign In</button>
            <button id="signup-tab" class="tab-button secondary">Sign Up</button>
          </div>
          <form id="signin-form" class="auth-form">
            <input id="signin-email" name="email" type="email" />
            <input id="signin-password" name="password" type="password" />
            <button id="signin-submit" type="submit">Sign In</button>
          </form>
          <form id="signup-form" class="auth-form hidden">
            <input id="signup-email" name="email" type="email" />
            <input id="signup-password" name="password" type="password" />
            <input id="signup-confirm" name="confirm" type="password" />
            <button id="signup-submit" type="submit">Sign Up</button>
          </form>
          <div id="config-required" class="config-required hidden">
            <button id="open-options-from-modal">Open Options</button>
          </div>
          <button id="close-auth-modal" class="close-button">&times;</button>
          <button id="forgot-password" class="secondary">Forgot Password?</button>
        </dialog>
      </body>
    </html>
  `);

  global.window = dom.window;
  global.document = dom.window.document;
  global.chrome = { runtime: { openOptionsPage: vi.fn() } };

  return dom;
};

describe('AuthModalComponent', () => {
  let component;
  let mockAuthService;
  let mockConfigService;
  let mockErrorService;
  let mockValidationService;
  let dom;

  beforeEach(() => {
    dom = setupDOM();
    mockAuthService = createMockAuthService();
    mockConfigService = createMockConfigService();
    mockErrorService = createMockErrorService();
    mockValidationService = createMockValidationService();

    component = new AuthModalComponent(
      mockAuthService,
      mockConfigService,
      mockErrorService,
      mockValidationService
    );
  });

  afterEach(() => {
    dom?.window.close();
    vi.resetAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with services', async () => {
      await component.initialize();
      expect(component.isInitialized).toBe(true);
      expect(component.modal).toBeTruthy();
    });
  });

  describe('show method', () => {
    beforeEach(async () => {
      await component.initialize();
      // Mock modal methods
      component.modal.showModal = vi.fn();
      component.modal.close = vi.fn();
    });

    it('should call isSupabaseConfigured on show', async () => {

      await component.show('signin');

      // This test would fail if we called hasValidConfig instead of isSupabaseConfigured
      expect(mockConfigService.isSupabaseConfigured).toHaveBeenCalled();
      expect(component.modal.showModal).toHaveBeenCalled();
    });

    it('should show auth forms when configured', async () => {
      mockConfigService.isSupabaseConfigured.mockResolvedValue(true);

      await component.show('signin');

      const authTabs = document.getElementById('auth-tabs');
      const configRequired = document.getElementById('config-required');
      
      expect(authTabs.classList.contains('hidden')).toBe(false);
      expect(configRequired.classList.contains('hidden')).toBe(true);
    });

    it('should show config required when not configured', async () => {
      mockConfigService.isSupabaseConfigured.mockResolvedValue(false);

      await component.show('signin');

      const authTabs = document.getElementById('auth-tabs');
      const configRequired = document.getElementById('config-required');
      
      expect(authTabs.classList.contains('hidden')).toBe(true);
      expect(configRequired.classList.contains('hidden')).toBe(false);
    });
  });

  describe('authentication', () => {
    beforeEach(async () => {
      await component.initialize();
      component.modal.close = vi.fn();
    });

    it('should handle successful sign in', async () => {
      mockAuthService.signIn.mockResolvedValue();
      const onAuthSuccess = vi.fn();
      component.onAuthSuccess = onAuthSuccess;

      const form = document.getElementById('signin-form');
      form.elements.email.value = 'test@example.com';
      form.elements.password.value = 'password123';

      const event = new Event('submit');
      Object.defineProperty(event, 'target', { value: form });
      
      await component.handleSignIn(event);

      expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(onAuthSuccess).toHaveBeenCalled();
    });

    it('should validate email before sign in', async () => {
      mockValidationService.validateEmail.mockReturnValue({ isValid: false, data: null, errors: ['Invalid email'] });

      const form = document.getElementById('signin-form');
      form.elements.email.value = 'invalid-email';
      form.elements.password.value = 'password123';

      const event = new Event('submit');
      Object.defineProperty(event, 'target', { value: form });
      
      await component.handleSignIn(event);

      expect(mockValidationService.validateEmail).toHaveBeenCalledWith('invalid-email');
      expect(mockAuthService.signIn).not.toHaveBeenCalled();
    });
  });
});