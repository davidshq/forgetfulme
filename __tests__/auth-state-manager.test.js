import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import AuthStateManager from '../utils/auth-state-manager.js';

// Mock Chrome extension APIs
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
  },
};

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('AuthStateManager', () => {
  let authManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup global mocks
    global.chrome = mockChrome;
    global.console = mockConsole;
    
    // Create new instance for each test
    authManager = new AuthStateManager();
  });

  afterEach(() => {
    // Clean up
    if (authManager) {
      authManager.listeners.clear();
    }
  });

  describe('Constructor', () => {
    test('should initialize with no auth state', () => {
      expect(authManager.authState).toBeNull();
      expect(authManager.listeners).toBeInstanceOf(Set);
      expect(authManager.initialized).toBe(false);
    });
  });

  describe('initialize', () => {
    test('should initialize successfully with no existing auth state', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });

      await authManager.initialize();

      expect(authManager.initialized).toBe(true);
      expect(authManager.authState).toBeNull();
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(['auth_session']);
      expect(mockChrome.storage.onChanged.addListener).toHaveBeenCalled();
      expect(mockConsole.log).toHaveBeenCalledWith(
        'AuthStateManager initialized, current state:',
        'not authenticated'
      );
    });

    test('should initialize with existing auth state', async () => {
      const mockSession = { user: { id: '123', email: 'test@example.com' } };
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: mockSession });

      await authManager.initialize();

      expect(authManager.initialized).toBe(true);
      expect(authManager.authState).toEqual(mockSession);
      expect(mockConsole.log).toHaveBeenCalledWith(
        'AuthStateManager initialized, current state:',
        'authenticated'
      );
    });

    test('should not initialize twice', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });

      await authManager.initialize();
      await authManager.initialize();

      expect(mockChrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });

    test('should handle initialization errors', async () => {
      const error = new Error('Storage error');
      mockChrome.storage.sync.get.mockRejectedValue(error);

      await expect(authManager.initialize()).rejects.toThrow('Storage error');
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error initializing AuthStateManager:',
        error
      );
    });
  });

  describe('getAuthState', () => {
    test('should return current auth state', async () => {
      const mockSession = { user: { id: '123' } };
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: mockSession });
      
      await authManager.initialize();
      const result = await authManager.getAuthState();

      expect(result).toEqual(mockSession);
    });

    test('should initialize if not already initialized', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });

      const result = await authManager.getAuthState();

      expect(authManager.initialized).toBe(true);
      expect(result).toBeNull();
    });
  });

  describe('setAuthState', () => {
    test('should set and persist auth state', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      await authManager.initialize();

      const mockSession = { user: { id: '123', email: 'test@example.com' } };
      await authManager.setAuthState(mockSession);

      expect(authManager.authState).toEqual(mockSession);
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        auth_session: mockSession,
      });
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'AUTH_STATE_CHANGED',
        session: mockSession,
      });
      expect(mockConsole.log).toHaveBeenCalledWith(
        'Auth state updated:',
        'authenticated'
      );
    });

    test('should notify listeners of auth state changes', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      await authManager.initialize();

      const mockCallback = vi.fn();
      authManager.addListener('authStateChanged', mockCallback);

      const mockSession = { user: { id: '123' } };
      await authManager.setAuthState(mockSession);

      expect(mockCallback).toHaveBeenCalledWith(mockSession);
    });

    test('should handle runtime message errors gracefully', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      mockChrome.runtime.sendMessage.mockRejectedValue(new Error('No listeners'));
      await authManager.initialize();

      const mockSession = { user: { id: '123' } };
      await authManager.setAuthState(mockSession);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        'No runtime message listeners available:',
        'No listeners'
      );
    });
  });

  describe('clearAuthState', () => {
    test('should clear auth state', async () => {
      const mockSession = { user: { id: '123' } };
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: mockSession });
      await authManager.initialize();

      await authManager.clearAuthState();

      expect(authManager.authState).toBeNull();
      expect(mockChrome.storage.sync.remove).toHaveBeenCalledWith(['auth_session']);
      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'AUTH_STATE_CHANGED',
        session: null,
      });
      expect(mockConsole.log).toHaveBeenCalledWith('Auth state cleared');
    });

    test('should notify listeners when clearing auth state', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      await authManager.initialize();

      const mockCallback = vi.fn();
      authManager.addListener('authStateChanged', mockCallback);

      await authManager.clearAuthState();

      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });

  describe('isAuthenticated', () => {
    test('should return true when authenticated', async () => {
      const mockSession = { user: { id: '123' } };
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: mockSession });
      await authManager.initialize();

      const result = await authManager.isAuthenticated();

      expect(result).toBe(true);
    });

    test('should return false when not authenticated', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      await authManager.initialize();

      const result = await authManager.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('handleAuthStateChange', () => {
    test('should update auth state from storage changes', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      await authManager.initialize();

      const mockSession = { user: { id: '123' } };
      authManager.handleAuthStateChange(mockSession);

      expect(authManager.authState).toEqual(mockSession);
      expect(mockConsole.log).toHaveBeenCalledWith(
        'Auth state changed via storage:',
        'authenticated'
      );
    });

    test('should not notify listeners if state did not change', async () => {
      const mockSession = { user: { id: '123' } };
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: mockSession });
      await authManager.initialize();

      const mockCallback = vi.fn();
      authManager.addListener('authStateChanged', mockCallback);

      // Set same session again
      authManager.handleAuthStateChange(mockSession);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should notify listeners when state changes', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      await authManager.initialize();

      const mockCallback = vi.fn();
      authManager.addListener('authStateChanged', mockCallback);

      const mockSession = { user: { id: '123' } };
      authManager.handleAuthStateChange(mockSession);

      expect(mockCallback).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('Listener Management', () => {
    test('should add and remove listeners', () => {
      const mockCallback = vi.fn();
      
      authManager.addListener('authStateChanged', mockCallback);
      expect(authManager.listeners.size).toBe(1);

      authManager.removeListener('authStateChanged', mockCallback);
      expect(authManager.listeners.size).toBe(0);
    });

    test('should notify listeners of events', () => {
      const mockCallback = vi.fn();
      authManager.addListener('authStateChanged', mockCallback);

      const mockData = { user: { id: '123' } };
      authManager.notifyListeners('authStateChanged', mockData);

      expect(mockCallback).toHaveBeenCalledWith(mockData);
    });

    test('should handle listener callback errors', () => {
      const mockCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      authManager.addListener('authStateChanged', mockCallback);

      const mockData = { user: { id: '123' } };
      authManager.notifyListeners('authStateChanged', mockData);

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Error in auth state listener:',
        expect.any(Error)
      );
    });

    test('should only notify listeners for matching events', () => {
      const mockCallback = vi.fn();
      authManager.addListener('otherEvent', mockCallback);

      const mockData = { user: { id: '123' } };
      authManager.notifyListeners('authStateChanged', mockData);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('getAuthSummary', () => {
    test('should provide auth summary when authenticated', async () => {
      const mockSession = { user: { id: '123', email: 'test@example.com' } };
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: mockSession });
      await authManager.initialize();

      const summary = authManager.getAuthSummary();

      expect(summary).toEqual({
        isAuthenticated: true,
        hasSession: true,
        userId: '123',
        email: 'test@example.com',
        initialized: true,
      });
    });

    test('should provide auth summary when not authenticated', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      await authManager.initialize();

      const summary = authManager.getAuthSummary();

      expect(summary).toEqual({
        isAuthenticated: false,
        hasSession: false,
        userId: null,
        email: null,
        initialized: true,
      });
    });

    test('should provide auth summary before initialization', () => {
      const summary = authManager.getAuthSummary();

      expect(summary).toEqual({
        isAuthenticated: false,
        hasSession: false,
        userId: null,
        email: null,
        initialized: false,
      });
    });
  });

  describe('notifyAllContexts', () => {
    test('should send runtime message to all contexts', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      await authManager.initialize();

      const mockSession = { user: { id: '123' } };
      authManager.notifyAllContexts(mockSession);

      expect(mockChrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'AUTH_STATE_CHANGED',
        session: mockSession,
      });
    });

    test('should handle runtime message errors gracefully', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ auth_session: null });
      mockChrome.runtime.sendMessage.mockImplementation(() => {
        throw new Error('Runtime error');
      });
      await authManager.initialize();

      const mockSession = { user: { id: '123' } };
      authManager.notifyAllContexts(mockSession);

      expect(mockConsole.debug).toHaveBeenCalledWith(
        'Error sending auth state message:',
        'Runtime error'
      );
    });
  });
});
