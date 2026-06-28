import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MESSAGE_TYPES } from '../../utils/constants.js';

vi.mock('../../utils/ui-components.js', () => ({
  default: {
    DOM: {
      ready: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock('../../utils/error-handler.js', () => ({
  default: {
    handle: vi.fn(),
  },
}));

import UIComponents from '../../utils/ui-components.js';
import ErrorHandler from '../../utils/error-handler.js';
import {
  initializePage,
  initializePageAuth,
} from '../../utils/page-controller.js';

describe('page-controller', () => {
  let authStateManager;
  let onAuthStateChange;

  beforeEach(() => {
    vi.clearAllMocks();

    onAuthStateChange = vi.fn();
    authStateManager = {
      initialize: vi.fn().mockResolvedValue(undefined),
      addListener: vi.fn(),
    };
  });

  describe('initializePageAuth', () => {
    it('initializes auth and registers the authStateChanged listener', async () => {
      await initializePageAuth({
        authStateManager,
        onAuthStateChange,
        listenForRuntimeAuth: false,
      });

      expect(authStateManager.initialize).toHaveBeenCalled();
      expect(authStateManager.addListener).toHaveBeenCalledWith(
        'authStateChanged',
        onAuthStateChange,
      );
    });

    it('forwards AUTH_STATE_CHANGED runtime messages to the callback', async () => {
      await initializePageAuth({
        authStateManager,
        onAuthStateChange,
        listenForRuntimeAuth: true,
      });

      const listener = chrome.runtime.onMessage.addListener.mock.calls[0][0];
      const session = { access_token: 'token' };

      listener({ type: MESSAGE_TYPES.AUTH_STATE_CHANGED, session });

      expect(onAuthStateChange).toHaveBeenCalledWith(session);
    });
  });

  describe('initializePage', () => {
    it('runs the shared bootstrap sequence for extension pages', async () => {
      const initializeElements = vi.fn();
      const initializeApp = vi.fn().mockResolvedValue(undefined);
      const configManager = {
        initialize: vi.fn().mockResolvedValue(undefined),
      };

      await initializePage({
        configManager,
        initConfigManager: true,
        authStateManager,
        initializeElements,
        initializeApp,
        onAuthStateChange,
        listenForRuntimeAuth: false,
        context: 'test.initializePage',
      });

      expect(UIComponents.DOM.ready).toHaveBeenCalled();
      expect(configManager.initialize).toHaveBeenCalled();
      expect(initializeElements).toHaveBeenCalled();
      expect(initializeApp).toHaveBeenCalled();
      expect(authStateManager.initialize).toHaveBeenCalled();
      expect(authStateManager.addListener).toHaveBeenCalledWith(
        'authStateChanged',
        onAuthStateChange,
      );
    });

    it('logs bootstrap failures and rethrows', async () => {
      const error = new Error('bootstrap failed');
      UIComponents.DOM.ready.mockRejectedValue(error);

      await expect(
        initializePage({
          authStateManager,
          initializeElements: vi.fn(),
          initializeApp: vi.fn(),
          onAuthStateChange,
          listenForRuntimeAuth: false,
          context: 'test.initializePage',
        }),
      ).rejects.toThrow('bootstrap failed');

      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        error,
        'test.initializePage',
      );
    });
  });
});
