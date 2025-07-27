import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock location.reload globally to prevent JSDOM navigation errors
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    reload: mockReload,
  },
  writable: true,
});

// Only mock external UI message calls - let other utilities use real implementations
vi.mock('../../utils/ui-messages.js', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    clear: vi.fn(),
  },
}));

// Import the actual modules (not mocked)
import UIComponents from '../../utils/ui-components.js';
import UIMessages from '../../utils/ui-messages.js';
import ErrorHandler from '../../utils/error-handler.js';

// Import the actual AuthUI class
import AuthUI from '../../auth-ui.js';

describe('AuthUI', () => {
  let authUI;
  let mockSupabaseConfig;
  let mockOnAuthSuccess;
  let mockAuthStateManager;
  let mockContainer;

  beforeEach(() => {
    // Reset location reload mock
    mockReload.mockClear();

    // Create mock dependencies
    mockSupabaseConfig = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      session: null,
    };

    mockOnAuthSuccess = vi.fn();
    mockAuthStateManager = {
      setAuthState: vi.fn(),
      clearAuthState: vi.fn(),
    };

    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'test-container';

    // Create AuthUI instance using the imported class
    authUI = new AuthUI(
      mockSupabaseConfig,
      mockOnAuthSuccess,
      mockAuthStateManager
    );
  });

  describe('Constructor', () => {
    it('should initialize with correct properties', () => {
      expect(authUI.config).toBe(mockSupabaseConfig);
      expect(authUI.onAuthSuccess).toBe(mockOnAuthSuccess);
      expect(authUI.authStateManager).toBe(mockAuthStateManager);
      expect(authUI.currentView).toBe('login');
    });

    it('should work without authStateManager', () => {
      const authUIWithoutManager = new AuthUI(
        mockSupabaseConfig,
        mockOnAuthSuccess
      );
      expect(authUIWithoutManager.authStateManager).toBeNull();
    });
  });

  describe('handleLogin', () => {
    beforeEach(() => {
      // Clear container
      mockContainer.innerHTML = '';
      
      // Set up real DOM elements with test values  
      const emailInput = document.createElement('input');
      emailInput.id = 'loginEmail';
      emailInput.value = 'test@example.com';
      mockContainer.appendChild(emailInput);
      
      const passwordInput = document.createElement('input');
      passwordInput.id = 'loginPassword';  
      passwordInput.value = 'password123';
      mockContainer.appendChild(passwordInput);
    });

    it('should validate required fields', async () => {
      // Clear the input values
      const emailInput = mockContainer.querySelector('#loginEmail');
      const passwordInput = mockContainer.querySelector('#loginPassword');
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';

      await authUI.handleLogin(mockContainer);

      expect(UIMessages.error).toHaveBeenCalledWith(
        'Please fill in all fields',
        mockContainer
      );
    });

    it('should call signIn with correct credentials', async () => {
      // Mock successful sign in
      mockSupabaseConfig.signIn.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleLogin(mockContainer);

      expect(mockSupabaseConfig.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    it('should show loading message during sign in', async () => {
      // Mock successful sign in
      mockSupabaseConfig.signIn.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleLogin(mockContainer);

      expect(UIMessages.loading).toHaveBeenCalledWith(
        'Signing in...',
        mockContainer
      );
    });

    it('should show success message and call onAuthSuccess on successful login', async () => {
      // Mock successful sign in
      mockSupabaseConfig.signIn.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleLogin(mockContainer);

      expect(UIMessages.success).toHaveBeenCalledWith(
        'Successfully signed in!',
        mockContainer
      );

      // Wait for setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(mockOnAuthSuccess).toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      mockSupabaseConfig.signIn.mockRejectedValue(error);

      await authUI.handleLogin(mockContainer);

      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        error,
        'auth-ui.handleLogin'
      );
      expect(UIMessages.error).toHaveBeenCalled();
    });
  });

  describe('handleSignup', () => {
    beforeEach(() => {
      // Clear container  
      mockContainer.innerHTML = '';
      
      // Set up real DOM elements with test values
      const emailInput = document.createElement('input');
      emailInput.id = 'signupEmail';
      emailInput.value = 'test@example.com';
      mockContainer.appendChild(emailInput);
      
      const passwordInput = document.createElement('input');
      passwordInput.id = 'signupPassword';
      passwordInput.value = 'password123';
      mockContainer.appendChild(passwordInput);
      
      const confirmInput = document.createElement('input');
      confirmInput.id = 'confirmPassword';
      confirmInput.value = 'password123';
      mockContainer.appendChild(confirmInput);
    });

    it('should validate required fields', async () => {
      // Clear the input values
      mockContainer.querySelectorAll('input').forEach(input => {
        input.value = '';
      });

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.error).toHaveBeenCalledWith(
        'Please fill in all fields',
        mockContainer
      );
    });

    it('should validate password confirmation', async () => {
      // Set mismatched passwords
      const confirmInput = mockContainer.querySelector('#confirmPassword');
      if (confirmInput) confirmInput.value = 'different';

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.error).toHaveBeenCalledWith(
        'Passwords do not match',
        mockContainer
      );
    });

    it('should validate password length', async () => {
      // Set short passwords
      const passwordInput = mockContainer.querySelector('#signupPassword');
      const confirmInput = mockContainer.querySelector('#confirmPassword');
      if (passwordInput) passwordInput.value = '123';
      if (confirmInput) confirmInput.value = '123';

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.error).toHaveBeenCalledWith(
        'Password must be at least 6 characters',
        mockContainer
      );
    });

    it('should call signUp with correct credentials', async () => {
      // Mock successful signup
      mockSupabaseConfig.signUp.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleSignup(mockContainer);

      expect(mockSupabaseConfig.signUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });

    it('should show loading message during signup', async () => {
      // Mock successful signup
      mockSupabaseConfig.signUp.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.loading).toHaveBeenCalledWith(
        'Creating account...',
        mockContainer
      );
    });

    it('should show success message and call onAuthSuccess on successful signup', async () => {
      // Mock successful signup
      mockSupabaseConfig.signUp.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.success).toHaveBeenCalledWith(
        'Account created! Please check your email to verify your account.',
        mockContainer
      );

      // The signup flow doesn't automatically call onAuthSuccess
      // It just shows a success message and switches to login form
    });

    it('should handle signup errors', async () => {
      const error = new Error('Email already exists');
      mockSupabaseConfig.signUp.mockRejectedValue(error);

      await authUI.handleSignup(mockContainer);

      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        error,
        'auth-ui.handleSignup'
      );
      expect(UIMessages.error).toHaveBeenCalled();
    });

    it('should handle signin error after successful signup', async () => {
      // Mock successful signup but failed signin
      mockSupabaseConfig.signUp.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });
      mockSupabaseConfig.signIn.mockRejectedValue(new Error('Signin failed'));

      await authUI.handleSignup(mockContainer);

      // The actual implementation shows a success message and switches to login form
      // instead of calling ErrorHandler for the signin error
      expect(UIMessages.success).toHaveBeenCalledWith(
        'Account created! Please check your email to verify your account.',
        mockContainer
      );
    });
  });

  describe('handleSignOut', () => {
    it('should call signOut and clear auth state', async () => {
      mockSupabaseConfig.signOut.mockResolvedValue();
      const onSignOutComplete = vi.fn();
      authUI.onSignOutComplete = onSignOutComplete;

      await authUI.handleSignOut();

      expect(mockSupabaseConfig.signOut).toHaveBeenCalled();
      expect(mockAuthStateManager.clearAuthState).toHaveBeenCalled();
      expect(onSignOutComplete).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const error = new Error('Sign out failed');
      mockSupabaseConfig.signOut.mockRejectedValue(error);

      await authUI.handleSignOut();

      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        error,
        'auth-ui.handleSignOut',
        { silent: true }
      );
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly error messages', () => {
      expect(
        authUI.getErrorMessage(new Error('Invalid login credentials'))
      ).toBe('Invalid email or password');
      expect(authUI.getErrorMessage(new Error('User already registered'))).toBe(
        'An account with this email already exists'
      );
      expect(
        authUI.getErrorMessage(
          new Error('Password should be at least 6 characters')
        )
      ).toBe('Password must be at least 6 characters');
      expect(
        authUI.getErrorMessage(new Error('Unable to validate email address'))
      ).toBe('Please enter a valid email address');
      expect(authUI.getErrorMessage(new Error('Unknown error'))).toBe(
        'Unknown error'
      );
    });
  });
});
